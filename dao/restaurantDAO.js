import mongodb from "mongodb"
const ObjectId = mongodb.ObjectId
let restaurant

export default class RestaurantDAO {
  static async injectDB(conn) {
    if (restaurant) {
      return;
    }
    try {
      restaurant = await conn
        .db(process.env.RESTREVIEWS_NS)
        .collection("restaurants");
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in restaurantDAO: ${e}`
      );
    }
  }

  static async getRestaurant({
    filters = null,
    page = 0,
    restaurantPerPage = 20,
  } = {}) {
    let query;
    if (filters) {
      if ("name" in filters) {
        query = { $text: { $search: filters["name"] } };
      } else if ("cuisine" in filters) {
        query = { cuisine: { $eq: filters["cuisine"] } };
      } else if ("zipcode" in filters) {
        query = { "address.zipcode": { $eq: filters["zipcode"] } };
      }
    }

    let cursor;

    try {
      cursor = await restaurant.find(query);
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { restaurantList: [], totalNumRestaurant: 0 };
    }

    const displayCursor = cursor
      .limit(restaurantPerPage)
      .skip(restaurantPerPage * page);

    try {
      const restaurantList = await displayCursor.toArray();
      const totalNumRestaurant = await restaurant.countDocuments(query);

      return { restaurantList, totalNumRestaurant };
    } catch (e) {
      console.error(
        `Unable to convert cursor to array or problem counting documents, ${e}`
      );
      return { restaurantList: [], totalNumRestaurant: 0 };
    }
  }
  static async getRestaurantByID(id) {
    try {
      const pipeline =  [
        {
          $match: {
              _id: new ObjectId(id),
          },
        },
            {
                $lookup: {
                  from: "reviews",
                  let: {
                    id: "$_id",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq:  ["$restaurant_id", "$$id"],
                        },
                      },
                    },
                    {
                      $sort: {
                        date: -1,
                      },
                    },
                  ],
                  as: "reviews",
                },
            },
            {
              $addFields: {
                reviews: "$reviews",
              },
            },
      ]
      return await restaurant.aggregate(pipeline).next()
    } catch (e) {
      console.error(`Something went wrong in getRestaurantByID: ${e}`)
      throw e
    }
  } 
  
  static async getCuisines() {
    let cuisines = []
    try {
      cuisines = await restaurant.distinct("cuisine")
      return cuisines
    } catch (e) {
      console.error(`Unable to get cuisines, ${e}`)
      return cuisines
    }
  }
}
