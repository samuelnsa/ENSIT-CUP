export const formaterDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    // Convert YYYY-MM-DD to DD / MM / YYYY
    return `${parts[2]} / ${parts[1]} / ${parts[0]}`;
  }
  return dateStr;
};
