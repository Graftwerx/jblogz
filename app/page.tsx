async function getData() {
  const items = [
    {
      title: "gfftyjmmgvf",
      content: "mkggdcdffgbv",
    },
  ];
  return items;
}

export default async function Home() {
  const data = await getData();

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Latest Posts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item) => (
          <h1 key={item.title}>{item.title}</h1>
        ))}
      </div>
    </div>
  );
}
