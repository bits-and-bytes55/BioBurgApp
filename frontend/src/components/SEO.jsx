import { useEffect } from "react";

const SEO = ({ seo }) => {
  useEffect(() => {
    if (!seo) return;

    if (seo.metaTitle) {
      document.title = seo.metaTitle;
    }

    if (seo.metaDescription) {
      let meta = document.querySelector("meta[name='description']");
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", seo.metaDescription);
    }
  }, [seo]);

  return null;
};

export default SEO;
