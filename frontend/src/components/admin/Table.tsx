import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: React.ReactNode;
}

/** Tabla genérica del panel administrativo. */
export function Table<T>({ columns, rows, rowKey, empty }: TableProps<T>): React.ReactElement {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={rowKey(row)}>
              {columns.map(column => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
