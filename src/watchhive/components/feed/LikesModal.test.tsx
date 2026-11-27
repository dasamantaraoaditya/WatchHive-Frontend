import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LikesModal } from './LikesModal';
import { interactionService } from '../../services/interaction.service';

vi.mock('../../contexts', () => ({
    useUI: () => ({
        registerModal: vi.fn(() => vi.fn()),
    }),
}));

vi.mock('../../services/interaction.service', () => ({
    interactionService: {
        getEntryLikes: vi.fn(),
    },
}));

describe('LikesModal Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.removeAttribute('data-modal-open');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    });

    it('returns null when isOpen is false', () => {
        const { container } = render(
            <MemoryRouter>
                <LikesModal
                    isOpen={false}
                    onClose={vi.fn()}
                    entryId="entry-1"
                />
            </MemoryRouter>
        );

        expect(container.firstChild).toBeNull();
        expect(document.body.getAttribute('data-modal-open')).toBeNull();
    });

    it('sets data-modal-open attribute on body when open and cleans up on unmount to prevent scroll-lock bug', () => {
        (interactionService.getEntryLikes as any).mockResolvedValue({
            likes: [],
            pagination: { total: 0, hasMore: false },
        });

        const { unmount } = render(
            <MemoryRouter>
                <LikesModal
                    isOpen={true}
                    onClose={vi.fn()}
                    entryId="entry-1"
                    entryTitle="Inception"
                />
            </MemoryRouter>
        );

        // Body must have data-modal-open
        expect(document.body.getAttribute('data-modal-open')).toBe('true');

        // Unmounting modal must release body scroll and remove data-modal-open
        unmount();
        expect(document.body.getAttribute('data-modal-open')).toBeNull();
        expect(document.body.style.overflow).toBe('');
    });

    it('renders list of liked users with their usernames', async () => {
        (interactionService.getEntryLikes as any).mockResolvedValue({
            likes: [
                {
                    id: 'like-1',
                    userId: 'u1',
                    username: 'filmlover',
                    displayName: 'Film Lover',
                    profilePictureUrl: null,
                    likedAt: new Date().toISOString(),
                },
            ],
            pagination: { total: 1, hasMore: false },
        });

        render(
            <MemoryRouter>
                <LikesModal
                    isOpen={true}
                    onClose={vi.fn()}
                    entryId="entry-1"
                    entryTitle="Oppenheimer"
                    initialLikeCount={1}
                />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Film Lover')).toBeInTheDocument();
            expect(screen.getByText('@filmlover')).toBeInTheDocument();
        });
    });
});
