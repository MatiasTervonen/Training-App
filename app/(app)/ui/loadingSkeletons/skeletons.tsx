export const TemplateSkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="animate-pulse bg-blue-700 py-2 my-3 rounded-md shadow-xl border-2 border-blue-500 text-lg h-[48px]"
      ></div>
    ))}
  </>
);
