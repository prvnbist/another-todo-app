import {
   split,
   ApolloClient,
   ApolloLink,
   InMemoryCache,
   createHttpLink,
   ApolloProvider,
} from '@apollo/client'
import React from 'react'
import tw, { GlobalStyles } from 'twin.macro'
import { getMainDefinition } from '@apollo/client/utilities'
import { WebSocketLink } from '@apollo/client/link/ws'

import '../styles/global.css'
import { Loader } from '../components'

const wssLink = process.browser
   ? new WebSocketLink({
        uri: process.env.HASURA_WSS_URL,
        options: {
           reconnect: true,
           connectionParams: {
              headers: {
                 'x-hasura-admin-secret': `${process.env.HASURA_ADMIN_SECRET}`,
              },
           },
        },
     })
   : null

const authLink = new ApolloLink((operation, forward) => {
   operation.setContext(({ headers }) => ({
      headers: {
         ...headers,
         'x-hasura-admin-secret': `${process.env.HASURA_ADMIN_SECRET}`,
      },
   }))
   return forward(operation)
})

const httpLink = createHttpLink({
   uri: `${process.env.HASURA_HTTPS_URL}`,
})

const splitLink = process.browser
   ? split(
        ({ query }) => {
           const definition = getMainDefinition(query)
           return (
              definition.kind === 'OperationDefinition' &&
              definition.operation === 'subscription'
           )
        },
        wssLink,
        authLink.concat(httpLink)
     )
   : authLink.concat(httpLink)

const client = new ApolloClient({
   link: splitLink,
   cache: new InMemoryCache(),
})

const App = ({ Component, pageProps }) => {
   const [session, setSession] = React.useState({
      loading: true,
      error: '',
      secret: '',
      authenticated: false,
      storeLocally: false,
   })
   React.useEffect(() => {
      let exists = localStorage.key('secret')
      if (exists) {
         const secret = localStorage.getItem('secret')
         if (secret === process.env.HASURA_ADMIN_SECRET) {
            setSession(session => ({
               ...session,
               loading: false,
               authenticated: true,
            }))
         } else {
            setSession(session => ({
               ...session,
               loading: false,
            }))
         }
      } else {
         setSession(session => ({
            ...session,
            loading: false,
         }))
      }
   }, [])

   if (session.loading)
      return (
         <div css={tw`h-screen w-screen`}>
            <Loader />
         </div>
      )
   return (
      <ApolloProvider client={client}>
         <GlobalStyles />
         <div css={tw`px-4 bg-gray-100 h-screen w-screen overflow-hidden`}>
            {session.authenticated ? (
               <Component {...pageProps} />
            ) : (
               <AuthForm session={session} setSession={setSession} />
            )}
         </div>
      </ApolloProvider>
   )
}

export default App

const AuthForm = ({ session, setSession }) => {
   const verify_session = () => {
      if (session.secret === process.env.HASURA_ADMIN_SECRET) {
         setSession(session => ({
            ...session,
            secret: '',
            authenticated: true,
         }))
         if (session.storeLocally) {
            localStorage.setItem('secret', session.secret)
         }
      } else {
         setSession(session => ({
            ...session,
            error: 'Incorrect code, please try again!',
         }))
      }
   }

   return (
      <div css={tw`h-screen flex items-center justify-center`}>
         <section css={tw`flex flex-col bg-white border p-4 rounded`}>
            <h2 css={tw`text-center text-gray-700 text-xl font-medium mb-3`}>
               Authentication
            </h2>
            <input
               type="password"
               value={session.secret}
               placeholder="Enter the secret code"
               css={tw`h-10 rounded px-3 bg-gray-100`}
               onChange={e =>
                  setSession(session => ({
                     ...session,
                     error: '',
                     secret: e.target.value,
                  }))
               }
            />
            {session.error && (
               <span css={tw`text-red-600`}>{session.error}</span>
            )}
            <button
               onClick={verify_session}
               disabled={session.secret.length === 0}
               css={[
                  tw`mt-3 px-3 h-10 rounded text-white uppercase tracking-wider`,
                  session.secret.length > 0
                     ? tw`bg-green-600`
                     : tw`bg-gray-300 text-gray-600 cursor-not-allowed`,
               ]}
            >
               Submit
            </button>
            <fieldset css={tw`mt-3`}>
               <input
                  css={tw`mr-2`}
                  type="checkbox"
                  id="store_locally"
                  name="store_locally"
                  checked={session.storeLocally}
                  onChange={() =>
                     setSession(session => ({
                        ...session,
                        storeLocally: !session.storeLocally,
                     }))
                  }
               />
               <label htmlFor="store_locally">Remember Me</label>
            </fieldset>
         </section>
      </div>
   )
}
