import React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import Header from "./Header";
import Home from "./Home";
import Snippets from "./Snippets";
import View from "./View";
import Form from "./Form";
import UserForms from "./UserForms";
import NoMatch from "./NoMatch";
import UserSettings from "./UserSettings";

import { UserProvider } from "../context/user-context";

export default function App() {
  return (
    <HashRouter>
      <UserProvider>
        <Header/>
        <main>
          <Switch>
            <Route path="/" exact component={Home} />
            <Route path="/snippets" exact component={Snippets} key="local" />
            <Route path="/snippets/create" component={Form} key="create" />
            <Route path="/snippets/:id" exact component={View} key="local" />
            <Route path="/snippets/:id/edit" component={Form} key="edit" />
            <Route path="/users/:username" exact component={Snippets} key="remote" />
            <Route path="/users/:username/:snippetId" exact component={View} key="remote" />
            <Route path="/users/:username/:snippetId/edit" component={Form} key="remote" />
            <Route path="/login" component={UserForms} key="login" />
            <Route path="/register" component={UserForms} key="register" />
            <Route path="/change/password" component={UserForms} key="change-password" />
            <Route path="/settings" component={UserSettings} />
            <Route component={NoMatch} />
          </Switch>
        </main>
      </UserProvider>
    </HashRouter>
  );
}
