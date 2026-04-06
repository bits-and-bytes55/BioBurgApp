import { GoogleMap, Polyline } from "@react-google-maps/api";

export default function LiveMap({ path }) {
  if (!path.length) return null;

  return (
    <GoogleMap
      zoom={15}
      center={path[path.length - 1]}
      mapContainerStyle={{ height: "300px", width: "100%" }}
    >
      <Polyline
        path={path}
        options={{ strokeColor: "#16a34a", strokeWeight: 4 }}
      />
    </GoogleMap>
  );
}
