import { useTranslation } from "react-i18next";
import { ModalSwipeBlocker } from "@/components/modal";

type TitleInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  value: string;
  label?: string;
  setValue: (value: string) => void;
};

export default function TitleInput({
  value,
  setValue,
  label,
  id,
  className,
  ...props
}: TitleInputProps) {
  const { t } = useTranslation("common");

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label htmlFor={id} className="text-gray-300 mb-1 text-sm">
          {label}
        </label>
      )}
      <ModalSwipeBlocker>
        <input
          type="text"
          id={id}
          className={`w-full p-2 rounded-md border-2 border-gray-400 z-10 placeholder-gray-500  text-gray-100 bg-[linear-gradient(50deg,#0f172a,#1e293b,#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300 ${className}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          maxLength={150}
          {...props}
        />
      </ModalSwipeBlocker>
      {typeof value === "string" && value.length >= 150 ? (
        <p className="text-yellow-400 mt-2">
          {t("common.charLimitReached", { max: 150 })}
        </p>
      ) : null}
    </div>
  );
}
