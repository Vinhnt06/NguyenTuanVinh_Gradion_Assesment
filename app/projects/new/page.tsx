'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkle, BookOpen } from '@phosphor-icons/react';
import AnimatedButton from '@/components/ui/AnimatedButton';

const SAMPLE_BOOKS = [
  {
    title: 'The Wind in the Willows — Vintage Classic',
    shortName: '🐸 Wind in the Willows',
    excerpt: `The Mole had been working very hard all the morning, spring-cleaning his little home. First with brooms, then with dusters; then on ladders and steps and chairs, with a brush and a pail of whitewash; till he had dust in his throat and eyes, and splashes of whitewash all over his black fur, and an ached back and weary arms. Spring was moving in the air above and in the earth below and around him, penetrating even his dark and lowly little house with its spirit of divine discontent and longing. It was small wonder, then, that he suddenly flung down his brush on the floor, said 'Bother!' and 'O blow!' and also 'Hang spring-cleaning!' and bolted out of the house without even waiting to put on his coat.

He thought his happiness was complete when, as he meandered aimlessly along, suddenly he stood by the edge of a full-fed river. Never in his life had he seen a river before—this sleek, sinuous, full-bodied animal, chasing and chuckling, gripping things with a gurgle and leaving them with a laugh, to fling itself on fresh playmates that shook themselves free. As he sat on the grass and looked across the river, a dark hole in the bank opposite caught his eye. A brown little face with whiskers emerged: Water Rat!`,
  },
  {
    title: 'Twenty Thousand Leagues Under the Sea — Victorian Steampunk',
    shortName: '🌊 20,000 Leagues',
    excerpt: `The year 1866 was signalized by a remarkable incident, a mysterious and inexplicable phenomenon, which doubtless no one has yet forgotten. Seafaring men were particularly excited. Merchants, common sailors, captains of vessels, and naval officers of all countries were deeply concerned with the matter. For some time past vessels had been met by an "enormous thing," a long object, spindle-shaped, occasionally phosphorescent, and infinitely larger and more rapid in its movements than a whale.

I had just returned from a scientific research in the bad lands of Nebraska. On my arrival at New York, I was honored by an invitation to join an expedition organized by the United States Government to pursue this monster. Captain Farragut had fitted out the Abraham Lincoln, a high-speed frigate. Ned Land, a Canadian harpooner of forty years of age, was on board. Before us, two cable-lengths away, a long black body emerged three feet above the water, surrounded by a vivid electric luminescence that blinded our eyes. We had finally met Captain Nemo's Nautilus.`,
  },
  {
    title: "Alice's Adventures in Wonderland — Whimsical Storybook",
    shortName: '🐇 Alice in Wonderland',
    excerpt: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?'

So she was considering in her own mind whether the pleasure of making a daisy-chain would be worth the trouble of getting up, when suddenly a White Rabbit with pink eyes ran close by her. The Rabbit actually TOOK A WATCH OUT OF ITS VEST-POCKET, and looked at it, and then hurried on. Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waist-coat pocket, or a watch to take out of it. Burning with curiosity, she ran across the field after it and saw it pop down a large rabbit-hole under the hedge.`,
  },
];

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [bookText, setBookText] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const wordCount = bookText.trim() ? bookText.trim().split(/\s+/).length : 0;
  const estimatedMin = Math.max(1, Math.ceil(wordCount / 500));

  const handleSelectPreset = (sample: (typeof SAMPLE_BOOKS)[0]) => {
    setTitle(sample.title);
    setBookText(sample.excerpt);
    setFileName('');
    setSelectedPreset(sample.shortName);
    setError('');
  };

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      setError('Please upload a plain text file (.txt)');
      return;
    }

    setError('');
    setFileName(file.name);
    setSelectedPreset(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBookText(text || '');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileChange(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a project title');
      return;
    }

    if (!bookText.trim()) {
      setError('Please provide book text by selecting a preset, pasting, or uploading a .txt file');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          bookText: bookText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      router.push(`/projects/${data.project.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#231F20] pb-16">
      {/* Header Bar */}
      <header className="border-b border-[#BAB7B1] bg-[#F2EEE7] px-6 py-4">
        <div className="max-w-[1100px] mx-auto flex justify-between items-center">
          <Link
            href="/projects"
            className="text-xs font-semibold text-[#595959] hover:text-[#FF6B00] transition-colors flex items-center gap-1"
          >
            ← Back to Projects
          </Link>
          <span className="text-[10px] font-bold text-[#919699] uppercase tracking-widest">
            STUDIO WIZARD
          </span>
        </div>
      </header>

      {/* Main Wizard Form */}
      <main className="max-w-[720px] mx-auto p-6 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-8 shadow-xs"
        >
          <div className="mb-6">
            <span className="text-[10px] font-extrabold text-[#FF6B00] uppercase tracking-wider block mb-1">
              PIPELINE INITIALIZATION
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight mb-1">
              Start New Illustration Studio
            </h2>
            <p className="text-xs text-[#595959] leading-relaxed">
              Select a public-domain sample book preset or upload your custom book text. This text is reused across all 5 steps via Gemini Files API.
            </p>
          </div>

          {/* BONUS SECTION §08: 1-Click Sample Public Domain Books Picker */}
          <div className="mb-6 p-4 bg-white/80 border border-[#CBD5E1] rounded-xl">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkle weight="fill" className="w-4 h-4 text-[#FF6B00]" />
              <span className="text-xs font-mono font-bold text-[#231F20] uppercase tracking-wider">
                1-Click Sample Book Presets (Bonus §08)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_BOOKS.map((book) => {
                const isSelected = selectedPreset === book.shortName;
                return (
                  <button
                    key={book.shortName}
                    type="button"
                    onClick={() => handleSelectPreset(book)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-all border flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-xs'
                        : 'bg-[#F8F8F8] border-[#BAB7B1] text-[#231F20] hover:border-[#FF6B00] hover:bg-white'
                    }`}
                  >
                    <span className="truncate">{book.shortName}</span>
                    {isSelected && <BookOpen weight="fill" className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-[#231F20] mb-1.5">
                Project Title <span className="text-[#FF6B00]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. The Wind in the Willows — Sepia Woodcut"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSelectedPreset(null);
                }}
                className="w-full px-4 py-3 bg-white border border-[#BAB7B1] rounded-xl text-sm text-[#231F20] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-[#231F20]">
                  Source Book Text <span className="text-[#FF6B00]">*</span>
                </label>
                {wordCount > 0 && (
                  <span className="text-[11px] font-mono text-[#595959]">
                    {wordCount.toLocaleString()} words · ~{estimatedMin} min context
                  </span>
                )}
              </div>

              {/* Drag and Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 mb-3 ${
                  isDragging
                    ? 'border-[#FF6B00] bg-[#FF6B00]/5 scale-[0.99]'
                    : fileName
                    ? 'border-[#231F20] bg-white'
                    : 'border-[#BAB7B1] hover:border-[#FF6B00] bg-white'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".txt"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-[#F8F8F8] border border-[#BAB7B1] text-[#FF6B00] text-lg font-bold flex items-center justify-center mx-auto mb-2">
                  📄
                </div>
                <p className="text-xs font-bold text-[#231F20]">
                  {fileName
                    ? `File Selected: ${fileName}`
                    : selectedPreset
                    ? `Preset Loaded: ${selectedPreset}`
                    : 'Drop your .txt book file here or click to browse'}
                </p>
                <p className="text-[11px] text-[#919699] mt-0.5">
                  Plain text only (.txt) · Enforces session context reuse
                </p>
              </div>

              <div className="relative flex py-1 items-center mb-3">
                <div className="flex-grow border-t border-[#BAB7B1]/60" />
                <span className="flex-shrink mx-3 text-[11px] font-semibold text-[#919699]">
                  OR EDIT TEXT DIRECTLY
                </span>
                <div className="flex-grow border-t border-[#BAB7B1]/60" />
              </div>

              <textarea
                rows={7}
                placeholder="Once upon a time, in a small burrow by the river, lived a quiet mole..."
                value={bookText}
                onChange={(e) => {
                  setBookText(e.target.value);
                  setSelectedPreset(null);
                }}
                className="w-full px-4 py-3 bg-white border border-[#BAB7B1] rounded-xl text-xs font-mono text-[#231F20] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] leading-relaxed transition-all"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <AnimatedButton
              type="submit"
              loading={loading}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {loading ? 'Initializing Pipeline...' : 'Initialize Studio Pipeline →'}
            </AnimatedButton>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
