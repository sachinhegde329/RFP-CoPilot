
/**
 * @fileOverview This file serves as the entry point for all data source connectors.
 * It exports an instance of each connector service and provides a factory function
 * to retrieve a connector service based on the data source type. This modular
 * approach allows for easy extension with new connectors in the future.
 */

import { confluenceService } from './confluence.service';
import { dropboxService } from './dropbox.service';
import { githubService } from './github.service';
import { googleDriveService } from './googleDrive.service';
import { notionService } from './notion.service';
import { sharepointService } from './sharepoint.service';
import { websiteCrawlerService } from './websiteCrawler.service';
import { highspotService } from './highspot.service';
import { showpadService } from './showpad.service';
import { seismicService } from './seismic.service';
import { mindtickleService } from './mindtickle.service';
import { enableusService } from './enableus.service';

import type { DataSource, DataSourceType } from '@/lib/knowledge-base';

// Export individual service instances
export {
  confluenceService,
  dropboxService,
  githubService,
  googleDriveService,
  notionService,
  sharepointService,
  websiteCrawlerService,
  highspotService,
  showpadService,
  seismicService,
  mindtickleService,
  enableusService,
};

// A dummy service for unimplemented connectors
const dummyConnector = {
    connect: async () => {
        throw new Error("This connector is not implemented yet.");
    },
    listResources: async () => {
        console.warn("This connector is not implemented yet.");
        return [];
    },
    fetchResource: async (resourceId: string) => {
        throw new Error(`This connector is not implemented yet. Cannot fetch ${resourceId}`);
    },
    sync: async (source: any) => {
        console.warn(`Sync for connector type ${source.type} is not implemented yet.`);
        return source;
    },
};


/**
 * Factory function to get the appropriate connector service based on the source type.
 * @param type The type of the data source.
 * @returns The corresponding connector service instance.
 */
export function getConnectorService(type: DataSourceType) {
    switch (type) {
        case 'gdrive':
            return googleDriveService;
        case 'sharepoint':
            return sharepointService;
        case 'website':
            return websiteCrawlerService;
        case 'confluence':
            return confluenceService;
        case 'dropbox':
            return dropboxService;
        case 'github':
            return githubService;
        case 'notion':
            return notionService;
        case 'highspot':
            return highspotService;
        case 'showpad':
            return showpadService;
        case 'seismic':
            return seismicService;
        case 'mindtickle':
            return mindtickleService;
        case 'enableus':
            return enableusService;
        default:
            console.warn(`Connector for type "${type}" not found.`);
            return dummyConnector;
    }
}
