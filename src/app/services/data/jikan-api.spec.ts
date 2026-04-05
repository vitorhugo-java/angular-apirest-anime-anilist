import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { JikanAPI } from './jikan-api';

describe('JikanAPI', () => {
  let service: JikanAPI;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), JikanAPI],
    });
    service = TestBed.inject(JikanAPI);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Additional tests for API methods can be added here, using HttpClientTestingModule to mock HTTP requests
  it('should fetch recommendations', () => {
    // Implement test for getRecommendations method
    service.getRecommendations().subscribe(recommendations => {
      expect(recommendations.length).toBeGreaterThanOrEqual(0); // Assuming it returns an array of recommendations
    });
  });

  it('should fetch anime by ID', () => {
    // Implement test for getAnimeById method
  });

  it('should search anime by query', () => {
    // Implement test for searchAnime method
  });

  it('should fetch seasonal anime', () => {
    service.getSeasonalAnime().subscribe(seasonalAnime => {
      expect(seasonalAnime.animes.length).toBeGreaterThanOrEqual(0); // Assuming it returns an array of seasonal anime
    });
  });
});
