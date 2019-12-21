import gql from 'graphql-tag'

const DELETE_TODO = gql`
   mutation deleteTodo($id: ID!) {
      deleteTodo(id: $id) {
         ... on TodoSuccess {
            success
            data {
               id
               label
               title
               status
               createdAt
               updatedAt
            }
         }
         ... on Error {
            success
            error
         }
      }
   }
`

export default DELETE_TODO
