import { twMerge as tw } from 'tailwind-merge';

export function ItemIcon({
    iconLink,
    className,
}: {
    iconLink: string | undefined;
    className?: string;
}) {
    return (
        <div class={tw('overflow-hidden rounded-md border border-stone-200/10', className)}>
            {/* scale to offset the inset clip path */}
            <img class={'h-8 w-8 scale-[1.05] [clip-path:inset(1px)]'} src={iconLink ?? ''} />
        </div>
    );
}
