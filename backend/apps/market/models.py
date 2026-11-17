from django.db import models
from apps.crops.models import Crop

class Market(models.Model):
    mandi_name = models.CharField(max_length=150)
    state = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    market_code = models.CharField(max_length=50, blank=True, default='')

    class Meta:
        unique_together = ('mandi_name', 'state', 'district')
        ordering = ['state', 'district', 'mandi_name']

    def __str__(self):
        return f"{self.mandi_name} ({self.district}, {self.state})"


class MarketPrice(models.Model):
    market = models.ForeignKey(Market, on_delete=models.CASCADE, related_name='prices')
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name='market_prices')
    variety = models.CharField(max_length=100, blank=True, default='Standard')
    price_date = models.DateField()
    
    min_price_rs_per_quintal = models.DecimalField(max_digits=10, decimal_places=2)
    max_price_rs_per_quintal = models.DecimalField(max_digits=10, decimal_places=2)
    modal_price_rs_per_quintal = models.DecimalField(max_digits=10, decimal_places=2)
    arrivals_tonnes = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    data_source = models.CharField(max_length=50, default='AGMARKNET')
    is_sample_data = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-price_date']

    def __str__(self):
        return f"{self.crop.name} at {self.market.mandi_name} on {self.price_date}: ₹{self.modal_price_rs_per_quintal}/Q"
