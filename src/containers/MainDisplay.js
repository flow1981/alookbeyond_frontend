import React, { Component } from "react";
import { Tab, Button, Header, Icon } from "semantic-ui-react";

import ListOfConstellations from "./ListOfConstellations";
import ListOfViewElements from "../containers/ListOfViewElements";
import ListOfWatchlists from "../containers/ListOfWatchlists";
import Viewport from "./Viewport";
import ARContainer from "./ARContainer";
import SelectionContainer from "./SelectionContainer";

import { _ } from "lodash";
import * as API from "../adapters/api";

class MainDisplay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      constellations: [],
      view: [],
      watchlists: [],
      // viewedConstellations: [],
      arViewOpen: false,
      modalOpen: false,
      activeTabIndex: 0
    };
  }

  componentDidMount() {
    API.getConstellations().then(constellations =>
      this.setState({ constellations })
    );
    API.getWatchlists().then(watchlists => this.setState({ watchlists }));
  }

  addOrFetchSatsForConstellationToView = constellation => {
    if (constellation.displayed == true) {
      console.log("already selected");
    } else {
      if (!constellation.satellites) {
        this.loadSatellitesForConstellationAndAddToView(constellation);
      } else {
        let updatedConstellation = this.toggleObjectDisplayStatus(
          constellation
        );
     
        this.updateConstellationInConstellationsState(
          constellation,
          updatedConstellation
        );

        this.addSatellitesToView(updatedConstellation.satellites);
      }
    }
  };

  loadSatellitesForConstellationAndAddToView = constellation => {
    return API.getConstellationSats(constellation.id)
      .then(constellation => this.toggleObjectDisplayStatus(constellation))
      .then(updatedConstellation =>
        this.updateConstellationInConstellationsState(
          constellation,
          updatedConstellation
        )
      )
      .then(updatedConstellation =>
        this.addSatellitesToView(updatedConstellation.satellites)
      );
  };

  // addConstellationToView = constellation => {

  //   const updatedConstellationList = [...this.state.constellations].map ( c =>
  //     c.id == constellation.id ? {...c, displayed: true} : c
  //   )
  //   this.setState({
  //     view: updatedViewlist,
  //     constellations: updatedConstellationList
  //   });
  // }

  changeConstellationDisplayToFalse = constellation => {
    let constellationDisplayFalse = { ...constellation, displayed: false };
    return constellationDisplayFalse;
  };

  changeChildrenSatelliteDisplayToggleToFalse = constellation =>
    constellation.satellites.map(sat => {
      sat.displayed = false;
      return sat;
    });

  removeConstellationFromView = constellation => {
    // remove the satellites that belong to the given constellation
    const updatedViewlist = [...this.state.view].filter(
      s => s.constellation_id != constellation.id
    );

    const updatedConstellationList = [...this.state.constellations].map(c => {
      if (c.id == constellation.id) {
        // toggle Display to false for the given constellation
        let constellationDisplayToggledFalse = this.changeConstellationDisplayToFalse(
          c
        );
        // toggle Display to false for satellites in the given constellation
        let childrenSatellitesDisplayToggleUpdated = this.changeChildrenSatelliteDisplayToggleToFalse(
          constellationDisplayToggledFalse
        );
        constellationDisplayToggledFalse.satellites = childrenSatellitesDisplayToggleUpdated
        return  constellationDisplayToggledFalse;
      } else {
        return c;
      }
    });
    debugger
    this.setState({
      view: updatedViewlist,
      constellations: updatedConstellationList
    });
  };

  updateConstellationInConstellationsState = (
    constellation,
    updatedConstellation
  ) => {
    let constellationsArray = [...this.state.constellations];
    let index = constellationsArray.indexOf(constellation);
    constellationsArray[index] = updatedConstellation;
    this.setState({ constellations: constellationsArray });
    return updatedConstellation;
  };

  addSatellitesToView = sats => {
    let satsToAdd = sats.filter(s => s.displayed != true);
    satsToAdd = satsToAdd.map(sat => this.toggleObjectDisplayStatus(sat));

    let updatedViewlist = [...this.state.view].concat(satsToAdd);
    this.setState({ view: updatedViewlist });
  };

  loadWatchlistInView = list => {
    let SatelliteConstellationIdArray = list.satellites.map(
      sat => sat.constellation_id
    );

    let uniqueArrayOfConstellationIds = [
      ...new Set(SatelliteConstellationIdArray)
    ];

    let constellationList = [...this.state.constellations];

    let matchedConstellationsArray = uniqueArrayOfConstellationIds.map(ID => {
      return constellationList.filter(
        constellation => constellation.id == ID
      )[0];
    });

    let matchedUniqueConstellationsArray = [
      ...new Set(matchedConstellationsArray)
    ];

    this.setState({
      view: list.satellites,
      viewedConstellations: matchedUniqueConstellationsArray
    });
  };

  saveViewToWatchlist = watchlist_name => {
    let target = [...this.state.watchlists].filter(
      watchlist => watchlist.name == watchlist_name
    );
    let non_targeted = [...this.state.watchlists].filter(
      watchlist => watchlist.name != watchlist_name
    );

    let sat_ids = [...this.state.view].map(sat => sat.id);
    let data = { sat_ids: sat_ids, watchlist_id: target[0].id };

    API.updateWatchList(data, target[0].id)
      .then(response =>
        this.addResponseToArrayAndReturnCombined(non_targeted, response)
      )
      .then(watchlists => this.setState({ watchlists }));
  };

  addResponseToArrayAndReturnCombined = (arrayOfElements, itemToAdd) => {
    arrayOfElements.push(itemToAdd);
    return arrayOfElements;
  };

  toggleObjectDisplayStatus = object => {
    object.displayed = !object.displayed;
    return object;
  };

  clearView = () => {
    let disableViewforAllConstellations = [...this.state.constellations].map(
      c => (c.displayed = false)
    );
    this.setState({
      view: [],
      constellations: disableViewforAllConstellations
    });
  };

  toggleARviewStatus = () =>
    this.setState({ arViewOpen: !this.state.arViewOpen });

  switchToViewTab = () => this.setState({ activeIndex: 1 });

  handleTabChange = (e, { activeTabIndex }) =>
    this.setState({ activeTabIndex });

  tabPanes = [
    {
      menuItem: { key: "constellation", icon: "bullseye", content: "SELECT" },
      render: () => (
        <Tab.Pane attached={false}>
          <p>
            Satellites can be classified by their function since they are
            launched into space to do a specific job. There are nine different
            types of satellites - here there are three of them.
          </p>
          <Header style={{ fontSize: "1em" }}>
            SELECT CONSTELLATIONS TO VIEW, and see how they differ in their
            altitude and orbital shape.
          </Header>
          <p>
            <i>
              Pro tip: Hover over <Icon name="info" /> to view more details of
              that particular constellation.
            </i>
          </p>
          <ListOfConstellations
            constellations={this.state.constellations}
            addOnClick={this.addOrFetchSatsForConstellationToView}
            removeOnClick={this.removeConstellationFromView}
          />
        </Tab.Pane>
      )
    },
    {
      menuItem: { key: "view", icon: "unhide", content: "CURRENT VIEW" },
      render: () => (
        <Tab.Pane attached={false}>
          {this.state.view.length == 0 ? (
            "You have not selected any constellations to visualise. Click on SELECT tab above and start adding some satellite constellations to your view. Otherwise, click on LOAD tab above to load a saved view."
          ) : (
            <ListOfViewElements
              view={this.state.view}
              watchlists={this.state.watchlists}
              constellations={this.state.constellations}
              // removeSatOnClick={this.removeSatelliteFromView}
              removeConOnClick={this.removeConstellationFromView}
              // removeSatAndConOnClick={
              //   this.removeSatelliteWithConstellationFromView
              // }
              clearView={this.clearView}
              saveViewToWatchlist={this.saveViewToWatchlist}
              constellationsInView={this.state.viewedConstellations}
            />
          )}
        </Tab.Pane>
      )
    },
    {
      menuItem: { key: "watchlists", icon: "list", content: "LOAD" },
      render: () => (
        <Tab.Pane attached={false}>
          <p>
            Select one of the saved views to visualise. You could also edit the
            view and ovewrite the list in CURRENT VIEW Tab.
          </p>
          <p>
            <i>
              (An AR version of the app is under development, so you could view
              them in AR soon!)
            </i>
          </p>
          <ListOfWatchlists
            watchlists={this.state.watchlists}
            loadWatchlistInView={this.loadWatchlistInView}
            switchToSecondTab={this.switchToViewTab}
          />
        </Tab.Pane>
      )
    }
  ];

  render() {
    return (
      <div className="main-display-container">
        {!this.state.arViewOpen ? (
          <Tab
            className="sidetabs"
            menu={{ attached: false }}
            panes={this.tabPanes}
            activeIndex={this.state.activeTabIndex}
            onTabChange={this.handleTabChange}
          />
        ) : null}
        <div className="flex-column-container">
          {!this.state.arViewOpen ? (
            <React.Fragment>
              <Viewport className="viewport" sats={this.state.view} />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <ARContainer
                className="ar-container"
                ARview={this.state.arViewOpen}
                sats={this.state.view}
              />
              <Button
                className="activate-ar-button"
                basic
                color="red"
                onClick={this.toggleARviewStatus}
              >
                3D View
              </Button>
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }
}

export default MainDisplay;
