import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const NoShowPrediction = () => {
  const [formData, setFormData] = useState({
    daysUntil: "1",
    travelTime: "0.5",
    pastNoShows: "0",
    isConfirmed: 'no',
    timeOfDay: 'morning',
    isWeekend: false,
    reminderSent: false,
  });

  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modelAccuracy, setModelAccuracy] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPrediction(null);
    
    try {
      console.log('Sending prediction request with data:', formData);
      
      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          daysUntil: parseInt(formData.daysUntil || "0"),
          travelTime: parseFloat(formData.travelTime || "0"),
          pastNoShows: parseInt(formData.pastNoShows || "0"),
          isConfirmed: formData.isConfirmed,
          timeOfDay: formData.timeOfDay,
          isWeekend: formData.isWeekend,
          reminderSent: formData.reminderSent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get prediction. Server returned ' + response.status);
      }

      const data = await response.json();
      console.log('Prediction response:', data);
      setPrediction({
        willAttend: data.willAttend,
        confidence: data.confidence,
        reason: data.reason
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to get prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const retrainModel = async () => {
    try {
      console.log('Retraining model...');
      const response = await fetch('http://localhost:5000/api/retrain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Retraining error:', data);
        throw new Error(data.error || 'Failed to retrain model');
      }
      
      console.log('Retraining successful:', data);
      setModelAccuracy(data.accuracy);
      toast.success(`Model retrained with accuracy: ${(data.accuracy * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('Error retraining model:', error);
      toast.error('Failed to retrain model');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Audition No-Show Prediction</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Predict Attendance</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="daysUntil">Days Until Audition</Label>
                    <Input
                      id="daysUntil"
                      name="daysUntil"
                      type="number"
                      min="0"
                      value={formData.daysUntil}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="travelTime">Travel Time (hours)</Label>
                    <Input
                      id="travelTime"
                      name="travelTime"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.travelTime}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="pastNoShows">Past No-Shows</Label>
                    <Input
                      id="pastNoShows"
                      name="pastNoShows"
                      type="number"
                      min="0"
                      value={formData.pastNoShows}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="timeOfDay">Time of Day</Label>
                    <Select 
                      value={formData.timeOfDay} 
                      onValueChange={(value) => handleSelectChange('timeOfDay', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select time of day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="isConfirmed"
                      checked={formData.isConfirmed === 'yes'}
                      onCheckedChange={(checked) => 
                        handleSelectChange('isConfirmed', checked ? 'yes' : 'no')
                      }
                    />
                    <Label htmlFor="isConfirmed">Confirmed Attendance</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="isWeekend"
                      checked={formData.isWeekend}
                      onCheckedChange={(checked) => 
                        handleSelectChange('isWeekend', checked)
                      }
                    />
                    <Label htmlFor="isWeekend">Weekend Audition</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="reminderSent"
                      checked={formData.reminderSent}
                      onCheckedChange={(checked) => 
                        handleSelectChange('reminderSent', checked)
                      }
                    />
                    <Label htmlFor="reminderSent">Reminder Sent</Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={retrainModel}
                  disabled={isLoading}
                >
                  Retrain Model
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Predicting...
                    </>
                  ) : 'Predict Attendance'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Prediction Result</CardTitle>
            </CardHeader>
            <CardContent>
              {prediction ? (
                <div className={`p-4 rounded-lg ${
                  prediction.willAttend ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                }`}>
                  <h3 className="text-xl font-semibold mb-2">
                    {prediction.willAttend ? '✅ Will Likely Attend' : '❌ May Not Attend'}
                  </h3>
                  <p className="mb-2">
                    Confidence: <strong>{(prediction.confidence * 100).toFixed(1)}%</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {prediction.reason || (prediction.willAttend 
                      ? 'High probability of attendance based on the provided information.'
                      : 'There\'s a significant chance of no-show based on the provided information.')}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-muted-foreground">
                    Submit the form to get a prediction
                  </p>
                </div>
              )}
              
              {modelAccuracy && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Model Accuracy: <strong>{(modelAccuracy * 100).toFixed(1)}%</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 text-sm text-muted-foreground">
        <p className="font-medium mb-2">How it works:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Uses a Support Vector Machine (SVM) model to predict audition attendance</li>
          <li>Considers factors like days until audition, travel time, past behavior, and more</li>
          <li>Model can be retrained with new data to improve accuracy</li>
        </ul>
      </div>
    </div>
  );
};

export default NoShowPrediction;
