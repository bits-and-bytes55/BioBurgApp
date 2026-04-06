const HeroSection = ({ data }) => {
  return (
    <section className="py-16 bg-blue-50 text-center">
      <h1 className="text-4xl font-bold">{data.heading}</h1>
      <p className="mt-4 text-lg">{data.content}</p>

      {data.image && (
        <img
          src={data.image}
          alt={data.heading}
          className="mx-auto mt-6"
        />
      )}
    </section>
  );
};

export default HeroSection;
