const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const getFormattedDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = MONTHS[new Date(date).getMonth()];
  const day = date.getDate().toString();
  return `${day} ${month} ${year}`;
};
