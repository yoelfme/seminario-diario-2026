import { describe, it, expect } from 'vitest';
import { applyDiscount } from '../../src/helpers/utils';

describe('applyDiscount', () => {
    it('should throw an error if the discount percentage is not between 0 and 100', () => {
        // Arrange
        const amount = 100;
        const discountPercentage = -10;

        // Act and assert
        expect(() => applyDiscount(amount, discountPercentage))
            .toThrow('Discount percentage must be between 0 and 100');
    });

    it('should throw an error if the discount percentage is greater than 100', () => {
        // Arrange
        const amount = 100;
        const discountPercentage = 110;

        // Act and assert
        expect(() => applyDiscount(amount, discountPercentage))
            .toThrow('Discount percentage must be between 0 and 100');
    });

    it('should throw an error if the amount is not a positive number', () => {
        // Arrange
        const amount = -100;
        const discountPercentage = 10;

        // Act and assert
        expect(() => applyDiscount(amount, discountPercentage))
            .toThrow('Amount must be a positive number');
    });

    it('should return the amount if the discount percentage is 0', () => {
        // Arrange
        const amount = 100;
        const discountPercentage = 0;

        // Act 
        const result = applyDiscount(amount, discountPercentage);

        // Assert
        expect(result).toBe(amount);
    });

    it.each([
        [100, 60, 40],
        [100, 0, 100],
        [100, 100, 0],
        [100, 50, 50],
        [100, 25, 75],
    ])('should return %s if the amount is %s and the discount percentage is %s', (amount, discountPercentage, expected) => {
        // Act 
        const result = applyDiscount(amount, discountPercentage);

        // Assert
        expect(result).toBe(expected);
    });

})
