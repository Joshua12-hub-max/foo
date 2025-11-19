export const convertTo24Hour = (time) => {
  if (!time) return null;
  const [timePart, period] = time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

export const getTodayDate = () => {
  return new Date().toLocaleDateString("en-US");
};