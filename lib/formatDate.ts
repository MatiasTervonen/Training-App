export const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export function formatDateFin(dateString: string): string {
  const date = new Date(dateString);

  // Get weekday in Finnish (e.g., "torstai")
  const weekday = new Intl.DateTimeFormat("fi-FI", { weekday: "long" }).format(
    date
  );

  // Get date in dd.MM.yyyy with leading zeros
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${weekday.slice(0, 2)} ${day}.${month}.${year}`;
}


export const formatDateWeek = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
  }).format(date);
};