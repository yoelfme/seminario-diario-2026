const applyDiscount = (amount, discountPercentage) => {
    if (discountPercentage < 0 || discountPercentage > 100) {
        throw new Error('Discount percentage must be between 0 and 100');
    }

    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error('Amount must be a positive number');
    }

    return amount - (amount * discountPercentage / 100);
}

export { applyDiscount };