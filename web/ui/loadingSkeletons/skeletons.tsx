import Spinner from "@/components/spinner";

export const TemplateSkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-center animate-pulse bg-gray-700 py-2 mb-10 rounded-md shadow border border-gray-800 h-[130px]"
      >
        <Spinner className="border-gray-500" />
      </div>
    ))}
  </>
);

export const FeedSkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-center animate-pulse bg-gray-800 py-2 mt-8 rounded-md shadow border border-gray-700 h-[150px]"
      >
        <Spinner className="border-gray-500" />
      </div>
    ))}
  </>
);

export const FriendCardSkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="flex items-center mb-3 justify-center animate-pulse bg-slate-900 py-2 w-full rounded-md shadow border border-gray-700 h-[72px]"
      >
        <Spinner className="border-gray-500" />
      </div>
    ))}
  </>
);

export const UserTableSkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-center animate-pulse bg-slate-900 py-2 w-full rounded-md shadow border border-gray-700 h-[41px]"
      ></div>
    ))}
  </>
);
