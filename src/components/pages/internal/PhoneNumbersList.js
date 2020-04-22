import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { NotificationDispatchContext } from '../../../contexts/NotificationContext';
import InternalTemplate from '../../templates/InternalTemplate';
import TableContent from '../../blocks/TableContent.js';

const PhoneNumbersList = () => {
  const dispatch = useContext(NotificationDispatchContext);
  useEffect(() => {
    document.title = `Phone Number Routing | Jambonz | Open Source CPAAS`;
  });

  //=============================================================================
  // Get phone numbers
  //=============================================================================
  const getPhoneNumbers = async () => {
    try {
      const phoneNumbersPromise = axios({
        method: 'get',
        baseURL: process.env.REACT_APP_API_BASE_URL,
        url: '/PhoneNumbers',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const accountsPromise = axios({
        method: 'get',
        baseURL: process.env.REACT_APP_API_BASE_URL,
        url: '/Accounts',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const applicationsPromise = axios({
        method: 'get',
        baseURL: process.env.REACT_APP_API_BASE_URL,
        url: '/Applications',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const sipTrunksPromise = axios({
        method: 'get',
        baseURL: process.env.REACT_APP_API_BASE_URL,
        url: '/VoipCarriers',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const promiseAllValues = await Promise.all([
        phoneNumbersPromise,
        accountsPromise,
        applicationsPromise,
        sipTrunksPromise,
      ]);
      const phoneNumbers = promiseAllValues[0].data;
      const accounts     = promiseAllValues[1].data;
      const applications = promiseAllValues[2].data;
      const sipTrunks    = promiseAllValues[3].data;

      // sort all applications and store to state for use in bulk editing
      const allApplications = [...applications, ];
      allApplications.sort((a, b) => {
        let valA = (a.name && a.name.toLowerCase()) || '';
        let valB = (b.name && b.name.toLowerCase()) || '';
        const result = valA > valB ? 1 : valA < valB ? -1 : 0;
        return result;
      });
      const applicationsForBulk = allApplications.map(app => ({
        name: app.name,
        application_sid: app.application_sid,
      }));
      applicationsForBulk.push({
        name: '- None -',
        application_sid: null,
      });
      setApplications(applicationsForBulk);

      const combinedData = phoneNumbers.map((p, i) => {
        const account     =     accounts.filter(a => a.account_sid      === p.account_sid      );
        const application = applications.filter(a => a.application_sid  === p.application_sid  );
        const sipTrunk    =    sipTrunks.filter(a => a.voip_carrier_sid === p.voip_carrier_sid );
        return {
          sid:         p.phone_number_sid,
          number:      p.number,
          account:     account[0]     && account[0].name,
          application: application[0] && application[0].name,
          sipTrunk:    sipTrunk[0]    && sipTrunk[0].name,
        };
      });
      return(combinedData);
    } catch (err) {
      dispatch({
        type: 'ADD',
        level: 'error',
        message: (err.response && err.response.data && err.response.data.msg) || 'Unable to get phone number data',
      });
      console.log(err.response || err);
    }
  };

  //=============================================================================
  // Delete phone number
  //=============================================================================
  const formatPhoneNumberToDelete = p => {
    return [
      { name: 'Number:',      content: p.number      || '' },
      { name: 'Account:',     content: p.account     || '' },
      { name: 'Application:', content: p.application || '' },
      { name: 'SIP Trunk:',   content: p.sipTrunk    || '' },
    ];
  };
  const deletePhoneNumber = async phoneNumber => {
    try {
      await axios({
        method: 'delete',
        baseURL: process.env.REACT_APP_API_BASE_URL,
        url: `/PhoneNumbers/${phoneNumber.sid}`,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return true;
    } catch (err) {
      dispatch({
        type: 'ADD',
        level: 'error',
        message: (err.response && err.response.data && err.response.data.msg) || 'Unable to delete phone number',
      });
      console.log(err.response || err);
      return false;
    }
  };

  //=============================================================================
  // Bulk Edit Applications
  //=============================================================================
  const [ applications, setApplications ] = useState([]);
  const handleBulkEditApplications = async (phoneNumberSids, application) => {
    try {
      for (const sid of phoneNumberSids) {
        await axios({
          method: 'put',
          baseURL: process.env.REACT_APP_API_BASE_URL,
          url: `/PhoneNumbers/${sid}`,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          data: {
            application_sid: application.application_sid,
          }
        });
      }
      return true;
    } catch (err) {
      dispatch({
        type: 'ADD',
        level: 'error',
        message: (err.response && err.response.data && err.response.data.msg) || 'Something went wrong, please try again.',
      });
      console.log(err.response || err);
      return false;
    }
  };

  //=============================================================================
  // Render
  //=============================================================================
  return (
    <InternalTemplate
      title="Phone Number Routing"
      addButtonText="Add a Phone Number"
      addButtonLink="/internal/phone-numbers/add"
    >
      <TableContent
        withCheckboxes
        name="phone number"
        urlParam="phone-numbers"
        getContent={getPhoneNumbers}
        columns={[
          { header: 'Number',      key: 'number'      },
          { header: 'SIP Trunk',   key: 'sipTrunk'    },
          { header: 'Account',     key: 'account'     },
          { header: 'Application', key: 'application' },
        ]}
        formatContentToDelete={formatPhoneNumberToDelete}
        deleteContent={deletePhoneNumber}
        bulkMenuItems={applications}
        bulkAction={handleBulkEditApplications}
      />
    </InternalTemplate>
  );
};

export default PhoneNumbersList;
