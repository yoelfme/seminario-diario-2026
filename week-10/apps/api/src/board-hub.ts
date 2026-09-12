import type { WSContext } from "hono/ws";
import { EventLog } from "./event-log.js";
import type { CardMove } from "./schemas.js";

/**
 * Modelo de canales: se suscribe a un recurso (`board:42`), no a una difusión
 * global. Si todos los clientes reciben todo y filtran en el navegador, eso es
 * fuga de datos y ancho de banda desperdiciado.
 */

export type BoardEvent = {
  type: "card:moved";
  cardId: string;
  x: number;
  y: number;
  by: string;
};

export type Card = { id: string; label: string; x: number; y: number };

/** Un socket no se cae solo: se queda abierto y muerto. El heartbeat lo detecta. */
export const HEARTBEAT_MS = 25_000;

/** Un corte de red no es una salida. Esperamos antes de anunciar la baja. */
const PRESENCE_GRACE_MS = 5_000;

type Member = { ws: WSContext; clientId: string; missedPongs: number };

type Board = {
  id: string;
  cards: Map<string, Card>;
  members: Set<Member>;
  log: EventLog<BoardEvent>;
  leaving: Map<string, NodeJS.Timeout>;
};

const boards = new Map<string, Board>();

function seedCards(): Map<string, Card> {
  const initial: Card[] = [
    { id: "card-1", label: "Diseñar el esquema", x: 8, y: 12 },
    { id: "card-2", label: "Firmar el webhook", x: 40, y: 30 },
    { id: "card-3", label: "Medir la latencia", x: 70, y: 55 },
  ];
  return new Map(initial.map((card) => [card.id, card]));
}

function getBoard(boardId: string): Board {
  let board = boards.get(boardId);
  if (!board) {
    board = {
      id: boardId,
      cards: seedCards(),
      members: new Set(),
      log: new EventLog<BoardEvent>(),
      leaving: new Map(),
    };
    boards.set(boardId, board);
  }
  return board;
}

export function snapshot(boardId: string): { cards: Card[]; lastSeq: number } {
  const board = getBoard(boardId);
  return { cards: [...board.cards.values()], lastSeq: board.log.lastSeq };
}

export function join(boardId: string, ws: WSContext, clientId: string): Member {
  const board = getBoard(boardId);

  // Volvió dentro de la gracia: cancelamos la baja que estaba por anunciarse.
  const pending = board.leaving.get(clientId);
  if (pending) {
    clearTimeout(pending);
    board.leaving.delete(clientId);
  }

  const member: Member = { ws, clientId, missedPongs: 0 };
  board.members.add(member);
  broadcastPresence(board);
  return member;
}

export function leave(boardId: string, member: Member): void {
  const board = getBoard(boardId);
  board.members.delete(member);

  const timer = setTimeout(() => {
    board.leaving.delete(member.clientId);
    broadcastPresence(board);
  }, PRESENCE_GRACE_MS);
  board.leaving.set(member.clientId, timer);
}

/** Aplica el movimiento y lo reparte al resto del canal. Devuelve el evento numerado. */
export function applyMove(
  boardId: string,
  move: CardMove,
  by: string,
): { seq: number; event: BoardEvent } | null {
  const board = getBoard(boardId);
  const card = board.cards.get(move.cardId);
  if (!card) return null;

  card.x = move.x;
  card.y = move.y;

  const event: BoardEvent = {
    type: "card:moved",
    cardId: move.cardId,
    x: move.x,
    y: move.y,
    by,
  };
  const logged = board.log.append(event);

  send(board, { ...event, seq: logged.seq }, by);
  return { seq: logged.seq, event };
}

/** Lo que el cliente se perdió mientras estaba desconectado. */
export function since(boardId: string, cursor: number) {
  return getBoard(boardId)
    .log.since(cursor)
    .map((entry) => ({ ...entry.data, seq: entry.seq }));
}

function send(board: Board, payload: unknown, exceptClientId?: string): void {
  const text = JSON.stringify(payload);
  for (const member of board.members) {
    if (member.clientId === exceptClientId) continue;
    member.ws.send(text);
  }
}

function broadcastPresence(board: Board): void {
  const clients = [...new Set([...board.members].map((m) => m.clientId))];
  send(board, { type: "presence", clients });
}

/**
 * Un ping cada 25 s. Dos pongs sin respuesta y cerramos: un socket abierto no
 * significa un socket vivo, y un peer muerto retiene memoria indefinidamente.
 */
export function startHeartbeat(): NodeJS.Timeout {
  return setInterval(() => {
    for (const board of boards.values()) {
      for (const member of [...board.members]) {
        if (member.missedPongs >= 2) {
          member.ws.close(1001, "heartbeat timeout");
          board.members.delete(member);
          continue;
        }
        member.missedPongs += 1;
        member.ws.send(JSON.stringify({ type: "ping" }));
      }
      broadcastPresence(board);
    }
  }, HEARTBEAT_MS);
}

export function markAlive(member: Member): void {
  member.missedPongs = 0;
}

export function socketCount(): number {
  let total = 0;
  for (const board of boards.values()) total += board.members.size;
  return total;
}

export type { Member };
