const { gql } = require('apollo-server')

module.exports = gql`
   type Todo {
      id: ID!
      title: String!
      tags: [String]!
      status: Status
      createdAt: String
      updatedAt: String
   }
   enum Status {
      TODO
      IN_PROGRESS
      DONE
   }
   type Success {
      success: Boolean
      data: Todo
   }
   type Error {
      success: Boolean
      error: String
   }
   union Result = Success | Error
`
