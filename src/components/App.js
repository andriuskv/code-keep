import { lazy, Suspense } from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import { UserProvider } from "../context/user-context";
import Header from "./Header";
import Home from "./Home";

const Snippets = lazy(() => import("./Snippets"));
const RecentSnippets = lazy(() => import("./RecentSnippets"));
const LocalSnippets = lazy(() => import("./LocalSnippets"));
const View = lazy(() => import("./View"));
const Form = lazy(() => import("./Form"));
const Search = lazy(() => import("./Search"));
const UserForms = lazy(() => import("./UserForms"));
const UserSettings = lazy(() => import("./UserSettings"));
const NoMatch = lazy(() => import("./NoMatch"));

export default function App() {
  return (
    <HashRouter>
      <UserProvider>
        <Header/>
        <main>
          <Suspense fallback={<div></div>}>
            <Switch>
              <Route path="/" exact component={Home}/>
              <Route path="/snippets" exact component={LocalSnippets} key="local"/>
              <Route path="/snippets/create" component={Form} key="create"/>
              <Route path="/snippets/recent" component={RecentSnippets}/>
              <Route path="/snippets/:id" exact component={View} key="local"/>
              <Route path="/snippets/:id/edit" component={Form} key="edit"/>
              <Route path="/users/:username" exact component={Snippets} key="remote"/>
              <Route path="/users/:username/:snippetId" exact component={View} key="remote"/>
              <Route path="/users/:username/:snippetId/edit" component={Form} key="remote"/>
              <Route path="/search" component={Search}/>
              <Route path="/login" component={UserForms} key="login"/>
              <Route path="/register" component={UserForms} key="register"/>
              <Route path="/settings" component={UserSettings}/>
              <Route component={NoMatch}/>
            </Switch>
          </Suspense>
        </main>
      </UserProvider>
    </HashRouter>
  );
}
