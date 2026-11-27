import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WHRatingPicker } from './WHRatingPicker';

describe('WHRatingPicker', () => {
    it('renders without error with undefined rating (unrated)', () => {
        const onRatingChanged = vi.fn();
        render(<WHRatingPicker rating={undefined} onRatingChanged={onRatingChanged} />);

        expect(screen.getByText('—.—')).toBeInTheDocument();
        expect(screen.getByText('/ 10')).toBeInTheDocument();
        expect(screen.getByText('Slide checkpoints to rate movie')).toBeInTheDocument();
    });

    it('renders correctly with numeric rating', () => {
        const onRatingChanged = vi.fn();
        render(<WHRatingPicker rating={8.5} onRatingChanged={onRatingChanged} />);

        expect(screen.getByText('8.5')).toBeInTheDocument();
        expect(screen.getByText('Excellent / Highly Recommended 🔥')).toBeInTheDocument();
    });

    it('handles PostgreSQL numeric string rating ("8.5") without throwing TypeError', () => {
        const onRatingChanged = vi.fn();
        // Simulates API returning string from postgres numeric(3,1)
        render(<WHRatingPicker rating={"8.5" as any} onRatingChanged={onRatingChanged} />);

        // Must display formatted rating and NOT crash with currentScore.toFixed is not a function
        expect(screen.getByText('8.5')).toBeInTheDocument();
        expect(screen.getByText('Excellent / Highly Recommended 🔥')).toBeInTheDocument();
    });

    it('handles string integer rating ("10") without throwing', () => {
        const onRatingChanged = vi.fn();
        render(<WHRatingPicker rating={"10" as any} onRatingChanged={onRatingChanged} />);

        expect(screen.getByText('10.0')).toBeInTheDocument();
        expect(screen.getByText('Absolute Masterpiece / Cinematic Perfection 🏆')).toBeInTheDocument();
    });

    it('handles null and 0 safely as unrated', () => {
        const onRatingChanged = vi.fn();
        const { rerender } = render(<WHRatingPicker rating={null} onRatingChanged={onRatingChanged} />);
        expect(screen.getByText('—.—')).toBeInTheDocument();

        rerender(<WHRatingPicker rating={0} onRatingChanged={onRatingChanged} />);
        expect(screen.getByText('—.—')).toBeInTheDocument();

        rerender(<WHRatingPicker rating={"0" as any} onRatingChanged={onRatingChanged} />);
        expect(screen.getByText('—.—')).toBeInTheDocument();
    });
});
