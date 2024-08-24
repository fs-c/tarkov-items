export function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <div className='relative'>
            <label
                htmlFor='name'
                className='absolute -top-2 left-2 inline-block bg-gray-800 px-1 text-xs font-medium text-gray-100'
            >
                {label}
            </label>
            <input
                type='text'
                name='name'
                id='name'
                className='block w-full rounded-md border-0 bg-inherit py-1.5 text-gray-100 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6'
                value={value}
                onChange={(event) => {
                    onChange(event.currentTarget.value);
                }}
            />
        </div>
    );
}

export function InputNumber({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <Input
            label={label}
            value={value.toString()}
            onChange={(value) => {
                onChange(Number(value));
            }}
        />
    );
}
