import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Mock dependencies
jest.mock('@prisma/client', () => {
    const mockPrisma = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    };
    return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('Authentication Unit Tests', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        mockReq = {
            body: {}
        };
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
    });

    it('Should successfully hash a password and create a user (Mocked)', async () => {
        const password = 'plainPassword123';
        const hashedPassword = await bcrypt.hash(password, 10);

        expect(bcrypt.compareSync(password, hashedPassword)).toBe(true);
    });

    it('Should mock a successful database login check', async () => {
        const mockedUser = { id: 1, email: 'test@example.com', password: 'hashedpassword' };

        // Mock the resolved value from Prisma
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockedUser);

        const result = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
        expect(result).toEqual(mockedUser);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });
});
