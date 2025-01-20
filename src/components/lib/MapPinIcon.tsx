import { twMerge as tw } from 'tailwind-merge';

export function MapPinIconOutline({ className }: { className?: string }) {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className={tw('size-6', className)}
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
            />
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z'
            />
        </svg>
    );
}

export function MapPinIconSolid({ className }: { className?: string }) {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='currentColor'
            className={tw('size-6', className)}
        >
            <path
                fillRule='evenodd'
                d='m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'
                clipRule='evenodd'
            />
        </svg>
    );
}
