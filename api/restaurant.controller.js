import RestaurantDAO from "../dao/restaurantDAO.js"

export default class RestaurantController {
    static async apiGetRestaurant(req, res, next) {
        const restaurantPerPage = req.query.restaurantPerPage ? parseInt(req.query.restaurantPerPage, 10) : 20
        const page = req.query.page ? parseInt(req.query.page, 10) : 0

        let filters = {}
        if (req.query.cuisine) {
            filters.cuisine = req.query.cuisine
        }  else if (req.query.zipcode) {
            filters.zipcode = req.query.zipcode
        } else if (req.query.name) {
            filters.name = req.query.name
        }

        const { restaurantList, totalNumRestaurant } = await RestaurantDAO.getRestaurant({
          filters,
          page,
          restaurantPerPage 
        })

        let response = {
            restaurant: restaurantList,
            page: page,
            filters: filters,
            entries_per_page: restaurantPerPage,
            total_results: totalNumRestaurant,
        }
        res.json(response)
    }
    static async apiGetRestaurantById(req, res, next) {
        try {
            let id = req.params.id || {}
            let restaurant = await RestaurantDAO.getRestaurantByID(id)
            if (!restaurant) {
                res.status(404).json({ error: "Not found" })
                return
            }
            res.json(restaurant)
        } catch (e) {
            console.log(`api, ${e}`)
            res.status(500).json({ error: e })
        }
    }

    static async apiGetRestaurantCuisines(req, res, next) {
        try {
            let cuisines = await RestaurantDAO.getCuisines()
            res.json(cuisines)
        } catch (e) {
            console.log(`api, ${e}`)
            res.status(500).json({ error: e })
        }
    }
}