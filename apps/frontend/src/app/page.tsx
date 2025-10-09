'use client';

import { useState } from 'react';

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <main className="main">
      <div>
        <h1>Meetly</h1>
        <p>모임 일정 조율 시스템</p>
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Next.js로 마이그레이션 완료
        </p>
      </div>
    </main>
  );
}
