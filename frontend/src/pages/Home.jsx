import React, { useEffect, useState } from "react";
import axios from "axios";

// const BASE_API = import.meta.env.VITE_API_BASE_URL;
const BASE_API = import.meta.env.VITE_API_BASE_URL;


const Home = () => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${BASE_API}/api/pages/home`)
      .then(res => {
        setPage(res.data.page);
      })
      .catch(err => {
        console.error("CMS load failed", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!page) return <p>Page not found</p>;

  return (
    <>
      <SEO seo={page.seo} />
      <HomeSections sections={page.sections} />
    </>
  );
};

export default Home;
