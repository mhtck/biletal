import service from "./index";

export const tripService = {
  getAllTrips: () => {
    console.log("getalltrips")
    return service.get("/rest/trips/");
  },
};
