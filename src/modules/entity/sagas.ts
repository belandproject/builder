import { HubAPI } from 'lib/api/hub'

export function* entitySaga(_hub: HubAPI) {
  // // takes
  // yield takeEvery(FETCH_ENTITIES_BY_POINTERS_REQUEST, handleFetchEntitiesByPointersRequest)
  // yield takeEvery(FETCH_ENTITIES_BY_IDS_REQUEST, handleFetchEntitiesByIdsRequest)
  // yield takeEvery(DEPLOY_ENTITIES_REQUEST, handleDeployEntitiesRequest)
  // yield takeEvery(DEPLOY_ENTITIES_SUCCESS, handleDeployEntitiesSuccess)

  // // handlers
  // function* handleFetchEntitiesByPointersRequest(_action: FetchEntitiesByPointersRequestAction) {
  //   return;
  //   // const { type, pointers } = action.payload
  //   // try {
  //   //   const entities: Entity[] = yield call([catalyst, 'fetchEntitiesByPointers'], type, pointers)
  //   //   yield put(fetchEntitiesByPointersSuccess(type, pointers, entities))
  //   // } catch (error) {
  //   //   yield put(fetchEntitiesByPointersFailure(type, pointers, error.message))
  //   // }
  // }

  // function* handleFetchEntitiesByIdsRequest(action: FetchEntitiesByIdsRequestAction) {
  //   const { type, ids } = action.payload
  //   try {
  //     const entities: Entity[] = yield call([catalyst, 'fetchEntitiesByIds'], type, ids)
  //     yield put(fetchEntitiesByIdsSuccess(type, ids, entities))
  //   } catch (error) {
  //     yield put(fetchEntitiesByIdsFailure(type, ids, error.message))
  //   }
  // }

  // function* handleDeployEntitiesRequest(action: DeployEntitiesRequestAction) {
  //   const { entities } = action.payload
  //   try {
  //     const identity: AuthIdentity | undefined = yield getIdentity()

  //     if (!identity) {
  //       throw new Error('Invalid Identity')
  //     }

  //     yield all(
  //       entities.map(entity =>
  //         call([catalyst, 'deployEntity'], { ...entity, authChain: Authenticator.signPayload(identity, entity.entityId) })
  //       )
  //     )

  //     yield put(deployEntitiesSuccess(entities))
  //   } catch (error) {
  //     yield put(deployEntitiesFailure(entities, error.message))
  //   }
  // }

  // function* handleDeployEntitiesSuccess(action: DeployEntitiesSuccessAction) {
  //   const ids = action.payload.entities.map(entity => entity.entityId)
  //   if (ids.length > 0) {
  //     yield put(fetchEntitiesByIdsRequest(EntityType.WEARABLE, ids))
  //   }
  // }
}
