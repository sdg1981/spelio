import { formatAdminDate, getAdminDateTimeAttribute, getAdminDateTitle } from '../utils/dateFormat';

export function AdminTimestamp({ value }: { value: string | number | Date | null | undefined }) {
  const dateTime = getAdminDateTimeAttribute(value);
  const title = getAdminDateTitle(value);

  if (!dateTime) {
    return <span title={title}>{formatAdminDate(value)}</span>;
  }

  return (
    <time dateTime={dateTime} title={title}>
      {formatAdminDate(value)}
    </time>
  );
}
