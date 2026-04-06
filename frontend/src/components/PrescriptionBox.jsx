import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { FaUpload } from "react-icons/fa";
import "swiper/css";
import "swiper/css/pagination";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

const Card = ({ data }) => {
  const fileRef = useRef(null);
  const openUpload = () => fileRef.current.click();
  const navigate = useNavigate();

  return (
    <div className="card">
      {/*RIBBON */}
      {data.ribbon && <div className="ribbon">{data.ribbon}</div>}

      <div className="card-header">
        <div className="icon-wrap">
          <img src={data.image} alt={data.title} />
        </div>
        <div>
          <h3>{data.title}</h3>
          <p>{data.subtitle}</p>
        </div>
      </div>

      <div className="card-actions">
        {data.upload && (
          <>
            <button className="outline" onClick={openUpload}>
              <FaUpload size={12} /> Upload
            </button>
            <input type="file" hidden ref={fileRef} />
          </>
        )}
        <button
          className="solid"
          onClick={() => {
            if (data.title === "Pathology Lab Test") {
              navigate("/book-lab-test");
            }
            else if (data.title === "Radiology Diagnostics Test Bookings") {
              navigate("/register/radiology-diagnosticstest");
            }
            else if(data.title === "Order With Prescription"){
  navigate("/consultation");      
}
          }}
        >
          {data.action}
        </button>
      </div>

      <div className="card-steps">
        {data.steps.map((step, i) => (
          <div key={i} className="step">
            <span>{i + 1}</span>
            {step}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function PrescriptionServices() {
  const cards = [
    {
      title: "Order With Prescription",
      subtitle: "Upload prescription and get your medicines",
      image: "https://cdn-icons-png.flaticon.com/512/3209/3209265.png",
      action: "Dr. Consultation",
      upload: true,
      ribbon: "Popular",
      steps: [
        "Upload your prescription",
        "Pharmacist verifies medicines",
        "Medicines delivered at home",
      ],
    },
    {
      title: "Pathology Lab Test",
      subtitle: "Book lab tests easily from home",
      image: "https://cdn-icons-png.flaticon.com/512/4320/4320337.png",
      action: "Book Test",
      ribbon: "Recommended",
      steps: [
        "Choose pathology test",
        "Sample collection from home",
        "Reports available online",
      ],
    },
    {
      title: "Radiology Diagnostics Test Bookings",
      subtitle: "MRI, CT Scan, X-Ray & Ultrasound",
      image: "https://cdn-icons-png.flaticon.com/512/2966/2966482.png",
      action: "Book Scan",
      steps: [
        "Select diagnostic test",
        "Choose nearby center",
        "Get digital reports",
      ],
    },
  ];

  return (
    <>
      <style>{`
        .card {
          position: relative;
          background: #fff;
          border-radius: 16px;
          padding: 22px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 6px 18px rgba(0,0,0,.08);
          height: 100%;
          display: flex;
          flex-direction: column;
          transition: all .3s ease;
          overflow: hidden;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,.12);
        }

        /* RIBBON STYLE */
        .ribbon {
          position: absolute;
          top: 14px;
          right: -38px;
          transform: rotate(45deg);
          background: linear-gradient(135deg,#0fa678,#22c55e);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 40px;
          box-shadow: 0 4px 10px rgba(0,0,0,.15);
        }

        .card-header {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        /* ICON ANIMATION */
        .icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: #f0fdf9;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all .4s ease;
        }

        .icon-wrap img {
          width: 34px;
          transition: transform .4s ease;
        }

        .card:hover .icon-wrap {
          background: #e6f6f1;
        }

        .card:hover .icon-wrap img {
          transform: translateY(-4px) scale(1.05);
        }

        .card-header h3 {
          font-size: 16px;
          margin: 0;
          font-weight: 600;
        }

        .card-header p {
          font-size: 13px;
          color: #555;
          margin-top: 4px;
        }

        .card-actions {
          display: flex;
          gap: 10px;
          margin: 16px 0;
        }

        .card-actions button {
          font-size: 13px;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all .25s ease;
        }

        .outline {
          background: #fff;
          border: 1px solid #0fa678;
          color: #0fa678;
        }

        .outline:hover {
          background: #e6f6f1;
        }

        .solid {
          background: #0fa678;
          border: none;
          color: #fff;
        }

        .solid:hover {
          background: #0c8f66;
        }

        .card-steps {
          margin-top: auto;
          display: grid;
          gap: 10px;
        }

        .step {
          display: flex;
          gap: 8px;
          font-size: 13px;
          color: #444;
        }

        .step span {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #e6f6f1;
          color: #0fa678;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
        }
      `}</style>

      <Swiper
  modules={[Pagination, Autoplay]}
  spaceBetween={24}
  slidesPerView={1.1}
  loop={true}
  speed={600}
  autoplay={{
    delay: 2500,
    disableOnInteraction: false,
    pauseOnMouseEnter: true
  }}
  pagination={{ clickable: true }}
  breakpoints={{
    640: { slidesPerView: 1.5 },
    768: { slidesPerView: 2 },
    1024: { slidesPerView: 3 },
  }}
  style={{ padding: "20px 10px" }}
>
        {cards.map((item, i) => (
          <SwiperSlide key={i}>
            <Card data={item} />
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
}
