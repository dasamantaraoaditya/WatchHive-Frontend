import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PostLogSuccessModal } from './PostLogSuccessModal';

// Mock share helper
vi.mock('../../utils/shareHelper', () => ({
    shareCompletedWatch: vi.fn().mockResolvedValue(true),
}));

// Mock SuggestMovieModal
vi.mock('../suggestions/SuggestMovieModal', () => ({
    SuggestMovieModal: () => null,
}));

describe('PostLogSuccessModal Component', () => {
    it('returns null and does not render when isOpen is false', () => {
        const { container } = render(
            <PostLogSuccessModal
                isOpen={false}
                onClose={vi.fn()}
                title="Dune: Part Two"
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders movie title and falls back gracefully when title is "undefined"', () => {
        render(
            <PostLogSuccessModal
                isOpen={true}
                onClose={vi.fn()}
                title="undefined"
            />
        );

        // Should fallback to "Movie" instead of displaying raw "undefined"
        expect(screen.queryByText('undefined')).toBeNull();
        expect(screen.getByText(/"Movie" successfully logged to your Hive!/i)).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 4, name: 'Movie' })).toBeInTheDocument();
    });

    it('displays "Watching now" wording when isWatching is true', () => {
        render(
            <PostLogSuccessModal
                isOpen={true}
                onClose={vi.fn()}
                title="Arcane"
                isWatching={true}
                user={{ username: 'aditya', displayName: 'Aditya' }}
                watchBuddies={[{ username: 'bob', displayName: 'Bob' }]}
            />
        );

        expect(screen.getByText(/Watching now: Aditya with Bob/i)).toBeInTheDocument();
    });

    it('displays "Logged by" wording when isWatching is false (completed)', () => {
        render(
            <PostLogSuccessModal
                isOpen={true}
                onClose={vi.fn()}
                title="Interstellar"
                isWatching={false}
                user={{ username: 'aditya', displayName: 'Aditya' }}
                watchBuddies={[{ username: 'alice', displayName: 'Alice' }]}
            />
        );

        expect(screen.getByText(/Logged by Aditya with Alice/i)).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(
            <PostLogSuccessModal
                isOpen={true}
                onClose={onClose}
                title="Gladiator II"
            />
        );

        const closeBtn = screen.getByRole('button', { name: 'Close' });
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
