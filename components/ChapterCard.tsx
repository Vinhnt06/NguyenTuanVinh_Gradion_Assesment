'use client';

interface ChapterCardProps {
  chapter: {
    name: string;
    prompt: string;
    illustrationPath?: string;
  };
  isGenerating?: boolean;
}

export default function ChapterCard({ chapter, isGenerating }: ChapterCardProps) {
  return (
    <div className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
      {/* Image / Art Container (16:9 aspect for landscape chapter illustration) */}
      <div className="relative aspect-video w-full rounded-xl bg-[#F8F8F8] border border-[#E8E2E0] overflow-hidden flex items-center justify-center">
        {chapter.illustrationPath ? (
          // eslint-disable-next-next/no-img-element
          <img
            src={chapter.illustrationPath}
            alt={chapter.name}
            className="w-full h-full object-cover"
          />
        ) : isGenerating ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-[#FF6B00]">
              Generating chapter scene illustration...
            </span>
          </div>
        ) : (
          <span className="text-xs text-[#919699] font-medium">Illustration not generated yet</span>
        )}
      </div>

      {/* Body */}
      <div>
        <h4 className="text-base font-bold text-[#231F20] mb-1">{chapter.name}</h4>
        <p className="text-xs text-[#595959] leading-relaxed line-clamp-4">{chapter.prompt}</p>
      </div>
    </div>
  );
}
