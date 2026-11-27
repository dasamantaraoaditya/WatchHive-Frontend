import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const ProblemChild: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
    if (shouldThrow) {
        throw new Error('Test explosion');
    }
    return <div>Normal Content</div>;
};

const ResettableContainer: React.FC = () => {
    const [hasError, setHasError] = useState(true);
    return (
        <ErrorBoundary onReset={() => setHasError(false)}>
            <ProblemChild shouldThrow={hasError} />
        </ErrorBoundary>
    );
};

describe('ErrorBoundary', () => {
    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <ProblemChild />
            </ErrorBoundary>
        );
        expect(screen.getByText('Normal Content')).toBeInTheDocument();
    });

    it('catches runtime errors and renders fallback UI instead of blank screen', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(
            <ErrorBoundary>
                <ProblemChild shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.queryByText('Normal Content')).not.toBeInTheDocument();
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('Test explosion')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();

        spy.mockRestore();
    });

    it('allows retry via Try Again button', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(<ResettableContainer />);

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Try Again'));

        expect(screen.getByText('Normal Content')).toBeInTheDocument();
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();

        spy.mockRestore();
    });
});
