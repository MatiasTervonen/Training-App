import Spinner from "../../components/spinner";

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

export const FeedSkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-center animate-pulse bg-gray-700 py-2 mx-5 mt-[32px] rounded-md shadow border border-gray-700 h-[150px]"
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
