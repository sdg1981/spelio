import { Upload } from 'lucide-react';
import type { ChangeEvent } from 'react';

export function ImportDropzone({ onFileText }: { onFileText: (text: string) => void }) {
  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    onFileText(await file.text());
    event.target.value = '';
  }

  return (
    <label className="grid min-h-52 w-full cursor-pointer place-items-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center transition hover:border-slate-400 hover:bg-slate-50">
      <input className="sr-only" type="file" accept="application/json,.json" onChange={handleFile} />
      <span>
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-700">
          <Upload size={22} />
        </span>
        <span className="block text-base font-black text-slate-950">Choose JSON file</span>
        <span className="mt-2 block text-sm leading-6 text-slate-500">Load a local Spelio JSON file, then validate before importing.</span>
      </span>
    </label>
  );
}
