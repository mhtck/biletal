import service from "./index";

export const tripService = {
  getAllTrips: (data) => {
    return service.post("/rest/trips/", data);
  },
};
