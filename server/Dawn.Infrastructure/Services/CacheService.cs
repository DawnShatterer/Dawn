using System;
using System.Text.Json;
using System.Threading.Tasks;
using Dawn.Core.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System.Linq;

namespace Dawn.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<CacheService> _logger;
    private readonly IConnectionMultiplexer _redis;
    private readonly string _instanceName = "Dawn_"; // Keep synced with Program.cs

    public CacheService(IDistributedCache cache, ILogger<CacheService> logger, IConnectionMultiplexer redis)
    {
        _cache = cache;
        _logger = logger;
        _redis = redis;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            var cachedData = await _cache.GetStringAsync(key);
            if (string.IsNullOrEmpty(cachedData)) return default;

            return JsonSerializer.Deserialize<T>(cachedData);
        }
        catch (RedisConnectionException ex)
        {
            _logger.LogWarning(ex, "Redis connection failed for key {Key}. Falling back to database.", key);
            return default;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting data from cache (Key: {Key}). Falling back to database.", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        try
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromMinutes(10)
            };

            var serializedData = JsonSerializer.Serialize(value);
            await _cache.SetStringAsync(key, serializedData, options);
        }
        catch (RedisConnectionException ex)
        {
            _logger.LogWarning(ex, "Redis connection failed when setting key {Key}. Cache write skipped.", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting data in cache (Key: {Key}). Cache write skipped.", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            await _cache.RemoveAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing data from cache (Key: {Key})", key);
        }
    }

    public async Task RemoveByPrefixAsync(string prefix)
    {
        try
        {
            var endpoints = _redis.GetEndPoints();
            var server = _redis.GetServer(endpoints.First());
            
            // Note: Redis instance names are typically prefixed implicitly by IDistributedCache.
            // StackExchangeRedisCache prepends the InstanceName to the keys automatically.
            var keys = server.Keys(pattern: _instanceName + prefix + "*").ToArray();
            
            var db = _redis.GetDatabase();
            if (keys.Length > 0)
            {
                await db.KeyDeleteAsync(keys);
            }
        }
        catch (RedisConnectionException ex)
        {
            _logger.LogWarning(ex, "Redis connection failed when removing keys by prefix {Prefix}. Cache invalidation skipped.", prefix);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing data by prefix from cache (Prefix: {Prefix}). Cache invalidation skipped.", prefix);
        }
    }
}
