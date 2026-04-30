import React from 'react';

interface TableProps {
  columns: string[];
  data: Record<string, React.ReactNode>[];
}

export const Table: React.FC<TableProps> = ({ columns, data }) => {
  return (
    <table className="admin-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {columns.map((col) => (
              <td key={col}>{row[col]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
