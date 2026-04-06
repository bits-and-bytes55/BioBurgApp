const AboutSection = ({ data }) => {
  return (
    <section className="py-12 container mx-auto">
      <h2 className="text-3xl font-semibold">{data.heading}</h2>
      <p className="mt-3 text-gray-700">{data.content}</p>
    </section>
  );
};

export default AboutSection;
