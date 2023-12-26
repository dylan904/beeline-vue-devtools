import serialize from './serialize'

export default function getUrlKey(router) {
    const currentRoute = router?.currentRoute.value
    const serializedQuery = serialize(currentRoute.query)
    return serializedQuery ? currentRoute.name + '?' + serializedQuery : currentRoute.name
}