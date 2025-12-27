import { SearchResultCard } from "./search-result-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { NoteWithBook } from "@/types/note";

interface SearchResultsProps {
  results: NoteWithBook[];
  searchQuery?: string;
  isLoading?: boolean;
}

/**
 * 검색 결과 목록 컴포넌트
 */
export function SearchResults({
  results,
  searchQuery,
  isLoading,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">검색 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {results.map((note) => (
        <SearchResultCard key={note.id} note={note} searchQuery={searchQuery} />
      ))}
    </div>
  );
}

