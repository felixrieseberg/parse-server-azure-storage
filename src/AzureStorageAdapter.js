// AzureStorageAdapter
//
// Stores Parse files in Azure Blob Storage.

import * as Azure from 'azure-storage';
import requiredParameter from './RequiredParameter';

export class AzureStorageAdapter {
  // Creates an Azure Storage Client.
  constructor(
    accountName = requiredParameter('AzureStorageAdapter requires an account name'),
    container = requiredParameter('AzureStorageAdapter requires a container'),
    { accessKey = '',
      directAccess = false } = {}
  ) {
    this._accountName = accountName;
    this._accessKey = accessKey;
    this._container = container;
    this._directAccess = directAccess;

    // Init client
    this._client = Azure.createBlobService(this._accountName, this._accessKey);
  }

  /**
   * For a given config object, filename, and data, store a file in Azure Blob Storage
   * @param  {object} config
   * @param  {string} filename
   * @param  {string} data
   * @return {Promise} Promise containing the Azure Blob Storage blob creation response
   */
  createFile(filename, data) {
    let containerParams = {
      publicAccessLevel: (this._directAccess) ? 'blob' : undefined
    };

    return new Promise((resolve, reject) => {
      this._client.createContainerIfNotExists(this._container, containerParams, (cerr, cresult, cresponse) => {
        if (cerr) {
          return reject(cerr);
        }

        this._client.createBlockBlobFromText(this._container, filename, data, (err, result) => {
          if (err) {
            return reject(err);
          }

          resolve(result);
        });
      });
    });
  }

  /**
   * Delete a file if found by filename
   * @param  {object} config
   * @param  {string} filename
   * @return {Promise} Promise that succeeds with the result from Azure Storage
   */
  deleteFile(filename) {
    return new Promise((resolve, reject) => {
      this._client.deleteBlob(this._container, filename, (err, res) => {
          if (err) {
            return reject(err);
          }

          resolve(res);
        });
    });
  }

  /**
   * Search for and return a file if found by filename
   * @param  {object} config
   * @param  {string} filename
   * @return {Promise} Promise that succeeds with the result from Azure Storage
   */
  getFileData(filename) {
    return new Promise((resolve, reject) => {
      this._client.getBlobToText(this._container, filename, (err, text, blob, res) => {
        if (err) {
          return reject(err);
        }

        resolve(new Buffer(text));
      });
    });
  }

  /**
   * Generates and returns the location of a file stored in Azure Blob Storage for the given request and filename
   * The location is the direct Azure Blob Storage link if the option is set, otherwise we serve the file through parse-server
   * @param  {object} config
   * @param  {string} filename
   * @return {string} file's url
   */
  getFileLocation(config, filename) {
    if (this._directAccess) {
      return `https://${this._accountName}.blob.core.windows.net/${this._container}/${encodeURIComponent(filename)}`;
    }
    return (`${config.mount}/files/${config.applicationId}/${encodeURIComponent(filename)}`);
  }
}

export default AzureStorageAdapter;
