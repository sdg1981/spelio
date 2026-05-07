import { Upload } from 'lucide-react';

export function ImportDropzone({ onMockUpload }: { onMockUpload: () => void }) {
  return (
    <button
      className="grid min-h-52 w-full place-items-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center transition hover:border-slate-400 hover:bg-slate-50"
      onClick={onMockUpload}
    >
      <span>
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-700">
          <Upload size={22} />
        </span>
        <span className="block text-base font-black text-slate-950">Drop JSON file here</span>
        <span className="mt-2 block text-sm leading-6 text-slate-500">or choose a local file to preview validation. Import is mocked for now.</span>
      </span>
    </button>
  );
}
